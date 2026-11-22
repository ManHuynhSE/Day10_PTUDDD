import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList, TabParamList } from "../navigation";
import { loadBooks } from "../data/books";
import { normalize } from "../utils";
import type { Book } from "../types";
import BookCard from "../components/BookCard";
import { colors } from "../theme";
import { USE_API } from "../config";
import { fetchBooks, selectBooksState } from "../store/booksSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";

type Props = CompositeScreenProps<BottomTabScreenProps<TabParamList, "Home">, NativeStackScreenProps<RootStackParamList>>;

export function HomeScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const api = useAppSelector(selectBooksState);
  // BT10.11c: công tắc nguồn dữ liệu — true = API, false = mảng. Nút "Dùng dữ liệu mảng" tắt nó.
  const [useApi, setUseApi] = useState(USE_API);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [isTile, setIsTile] = useState(false); // Switch "Dạng lưới"

  // Lần đầu: tải mảng (làm dữ liệu dự phòng) và, nếu USE_API bật, gọi API qua thunk.
  useEffect(() => {
    loadBooks().then((data) => {
      setBooks(data);
      setLoading(false);
    });
    if (USE_API) dispatch(fetchBooks());
  }, [dispatch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (useApi) {
      await dispatch(fetchBooks());
    } else {
      setBooks(await loadBooks());
    }
    setRefreshing(false);
  }, [dispatch, useApi]);

  // BT10.11c: nguồn dữ liệu theo công tắc — categories và visible đều dùng sourceBooks.
  const sourceBooks = useApi ? api.items : books;
  const categories = useMemo(() => Array.from(new Set(sourceBooks.map((b) => b.category))), [sourceBooks]);

  // BT10.6: lọc theo category (null = tất cả) và keyword (tên hoặc tác giả, bỏ dấu).
  const visible = useMemo(() => {
    const kw = normalize(keyword);
    return sourceBooks.filter((b) => {
      const matchCategory = category === null || b.category === category;
      const matchKeyword =
        kw === "" || normalize(b.title).includes(kw) || normalize(b.author).includes(kw);
      return matchCategory && matchKeyword;
    });
  }, [sourceBooks, keyword, category]);

  const onSelect = useCallback(
    (id: string) => {
      navigation.navigate("Detail", { id });
    },
    [navigation]
  );

  const numColumns = isTile ? 2 : 1;
  const isLoading = useApi ? api.status === "loading" || api.status === "idle" : loading;
  const apiFailed = useApi && api.status === "failed";

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>📚 BookStore</Text>
        <TextInput
          style={styles.search}
          placeholder="Tìm theo tên sách hoặc tác giả…"
          placeholderTextColor="#9AA3B8"
          value={keyword}
          onChangeText={setKeyword}
        />
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Dạng lưới</Text>
          <Switch value={isTile} onValueChange={setIsTile} testID="grid-switch" />
        </View>
      </View>

      <View style={styles.chips}>
        {[null, ...categories].map((c) => (
          <TouchableOpacity
            key={c ?? "all"}
            style={[styles.chip, category === c && styles.chipOn]}
            onPress={() => setCategory(c)}
            testID={`chip-${c ?? "all"}`}
          >
            <Text style={[styles.chipText, category === c && styles.chipTextOn]}>{c ?? "Tất cả"}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {apiFailed ? (
        <View style={styles.center}>
          <Text style={styles.errorTitle}>Không tải được danh sách sách</Text>
          <Text style={styles.errorText}>{api.error ?? "Không tải được dữ liệu"}</Text>
          <View style={styles.errorActions}>
            <TouchableOpacity style={styles.errBtn} onPress={() => dispatch(fetchBooks())}>
              <Text style={styles.errBtnText}>Thử lại</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.errBtn, styles.errBtnAlt]}
              onPress={() => setUseApi(false)}
            >
              <Text style={[styles.errBtnText, { color: colors.indigo }]}>Dùng dữ liệu mảng</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.indigo} />
          <Text style={styles.empty}>Đang tải sách…</Text>
        </View>
      ) : (
        <FlatList
          data={visible}
          key={String(numColumns)}
          keyExtractor={(b) => b.id}
          numColumns={numColumns}
          columnWrapperStyle={isTile ? styles.columnWrapper : undefined}
          contentContainerStyle={{ padding: 14 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <BookCard book={item} layout={isTile ? "tile" : "row"} onSelect={onSelect} />
          )}
          ListEmptyComponent={<Text style={styles.empty}>Không tìm thấy sách phù hợp.</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { backgroundColor: colors.navy, paddingHorizontal: 14, paddingBottom: 12, paddingTop: 6, gap: 8 },
  title: { color: "#fff", fontSize: 22, fontWeight: "800" },
  search: { backgroundColor: "#fff", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 8 },
  switchLabel: { color: "#D5DDF7", fontWeight: "600" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 14, paddingTop: 10 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.line },
  chipOn: { backgroundColor: colors.indigo, borderColor: colors.indigo },
  chipText: { color: colors.text, fontWeight: "600", fontSize: 13 },
  chipTextOn: { color: "#fff" },
  columnWrapper: { justifyContent: "space-between" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  errorTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
  errorText: { color: colors.muted, textAlign: "center", paddingHorizontal: 24 },
  errorActions: { flexDirection: "row", gap: 10, marginTop: 6 },
  errBtn: { backgroundColor: colors.indigo, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: colors.indigo },
  errBtnAlt: { backgroundColor: "#fff" },
  errBtnText: { color: "#fff", fontWeight: "700" },
  banner: { color: "#B42318", marginBottom: 8, textAlign: "center" },
  empty: { textAlign: "center", color: colors.muted, marginTop: 30 },
  plain: { fontSize: 15, color: colors.text, paddingVertical: 4 },
});
